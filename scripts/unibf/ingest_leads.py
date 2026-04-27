"""
ingest_leads.py — Importa leads do CSV do Looker Studio para unibf.leads_crm

Suporta dois formatos:
  Básico  (Tabela 1): nome, telefone, modalidade, email, url_inteira, UTMs, Record Count
  Completo(Tabela 2): + data_hora_atual, data_hora_primeiro_acesso, mobile, escolaridade,
                        cidade, estado, curso, gclid, fbc, fbp

Datas: Looker Studio exporta em UTC — converte para BRT (UTC-3).

Uso:
    pip install -r requirements.txt
    python ingest_leads.py arquivo.csv [--dry-run]

Conexão: usa DATABASE_URL (psycopg2 direto) se disponível no .env.local,
         senão usa NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (PostgREST).
"""
import os
import re
import sys
import argparse
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client

# ─── Config ────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DATABASE_URL  = os.environ.get("DATABASE_URL")

BATCH_SIZE = 500
TABLE      = "leads_crm"
SCHEMA     = "unibf"
BRT        = timezone(timedelta(hours=-3))

MESES_PT = {
    "jan": 1, "fev": 2, "mar": 3, "abr": 4,
    "mai": 5, "jun": 6, "jul": 7, "ago": 8,
    "set": 9, "out": 10, "nov": 11, "dez": 12,
}

TEST_PATTERNS = re.compile(
    r"test lead|dummy data|test@|@example\.com",
    re.IGNORECASE,
)


# ─── Parsing de datas PT-BR ────────────────────────────────────────────────────

def parse_looker_date(raw) -> str | None:
    """
    Converte "16 de abr. de 2026, 04:22:19" (UTC Looker Studio) → ISO 8601 em BRT.
    Retorna string ISO para serialização JSON (ex: "2026-04-16T01:22:19-03:00").
    """
    if not raw or str(raw).strip().lower() in ("null", "none", ""):
        return None
    s = str(raw).strip()
    m = re.match(
        r"(\d{1,2})\s+de\s+(\w+?)\.?\s+de\s+(\d{4}),\s*(\d{2}:\d{2}:\d{2})",
        s, re.IGNORECASE,
    )
    if not m:
        return None
    day, mes_str, year, time_str = m.groups()
    mes = MESES_PT.get(mes_str.lower())
    if not mes:
        return None
    h, mi, sec = map(int, time_str.split(":"))
    dt_utc = datetime(int(year), mes, int(day), h, mi, sec, tzinfo=timezone.utc)
    dt_brt = dt_utc.astimezone(BRT)
    return dt_brt.isoformat()


def mes_ref_from_iso(iso: str | None) -> str | None:
    """Extrai 'YYYY-MM' de uma string ISO. Ex: '2026-04-16T...' → '2026-04'"""
    if not iso:
        return None
    return iso[:7]   # primeiros 7 chars: "2026-04"


# ─── Normalização ──────────────────────────────────────────────────────────────

def normalize_plataforma(raw) -> str | None:
    """Mapeia utm_source → 'google' | 'meta' | None (evita CHECK constraint)."""
    if not raw:
        return None
    s = str(raw).lower()
    if any(k in s for k in ("google", "doubleclick", "gdn")):
        return "google"
    if any(k in s for k in ("meta", "facebook", "instagram", "fb")):
        return "meta"
    return None  # valor desconhecido → omitido do upsert

def normalize_phone(raw) -> str | None:
    if pd.isna(raw) or str(raw).strip().lower() in ("null", "none", ""):
        return None
    digits = re.sub(r"\D", "", str(raw))
    if len(digits) < 8:
        return None
    if digits.startswith("55") and len(digits) >= 12:
        core = digits[2:]
    else:
        core = digits
    if len(core) < 10 or len(core) > 11:
        return digits if len(digits) >= 10 else None
    return "55" + core


def normalize_email(raw) -> str | None:
    if pd.isna(raw) or str(raw).strip().lower() in ("null", "none", ""):
        return None
    return str(raw).strip().lower()


def normalize_bool(raw) -> bool | None:
    if pd.isna(raw) or str(raw).strip().lower() in ("null", "none", ""):
        return None
    return str(raw).strip().lower() == "true"


def clean_text(raw) -> str | None:
    if pd.isna(raw) or str(raw).strip().lower() in ("null", "none", ""):
        return None
    v = str(raw).strip()
    return v if v else None


def is_test_lead(row: dict) -> bool:
    nome  = str(row.get("nome",  "") or "")
    email = str(row.get("email", "") or "")
    return bool(TEST_PATTERNS.search(nome) or TEST_PATTERNS.search(email))


# ─── Leitura do CSV ────────────────────────────────────────────────────────────

def load_csv(path: str) -> pd.DataFrame:
    # Tenta UTF-8 primeiro; se falhar, usa latin-1
    for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            df = pd.read_csv(path, dtype=str, keep_default_na=False, encoding=enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError(f"Não foi possível decodificar {path}")

    # Remove coluna "modalidade" duplicada (mantém só a primeira)
    cols = list(df.columns)
    if cols.count("modalidade") == 2:
        second_idx = [i for i, c in enumerate(cols) if c == "modalidade"][1]
        df = df.iloc[:, [i for i in range(len(cols)) if i != second_idx]]

    # Renomear → nomes do banco
    rename = {
        "url_inteira":              "url_pagina",
        "utm_campaign_atual":       "utm_campaign",
        "utm_source_atual":         "utm_source",
        "utm_content_atual":        "utm_content",
        "utm_term_atual":           "utm_term",
        "utm_medium_atual":         "utm_medium",
        "Record Count":             "record_count",
    }
    df = df.rename(columns=rename)
    return df


def detect_format(df: pd.DataFrame) -> str:
    """Retorna 'completo' se tiver colunas de data, caso contrário 'basico'."""
    return "completo" if "data_hora_atual" in df.columns else "basico"


# ─── Transformação ─────────────────────────────────────────────────────────────

def transform(df: pd.DataFrame) -> list[dict]:
    fmt = detect_format(df)
    print(f"  Formato detectado: {fmt} ({len(df.columns)} colunas)")

    # Ordena por data_hora_atual crescente para que o upsert mais recente vença
    if fmt == "completo" and "data_hora_atual" in df.columns:
        df = df.sort_values("data_hora_atual", ascending=True, na_position="first")

    rows        = []
    skipped_test  = 0
    skipped_nokey = 0
    seen_keys     = {}   # dedup dentro do próprio CSV (mesmo lead, múltiplas visitas)

    for _, row in df.iterrows():
        r = row.to_dict()

        if is_test_lead(r):
            skipped_test += 1
            continue

        telefone_norm = normalize_phone(r.get("telefone"))
        email_norm    = normalize_email(r.get("email"))

        if not telefone_norm and not email_norm:
            skipped_nokey += 1
            continue

        lead_key = telefone_norm or email_norm
        utm_source   = clean_text(r.get("utm_source"))
        plataforma   = normalize_plataforma(utm_source)

        # Datas + fuso
        dt_atual    = parse_looker_date(r.get("data_hora_atual"))
        dt_primeiro = parse_looker_date(r.get("data_hora_primeiro_acesso"))
        mes_ref     = mes_ref_from_iso(dt_atual) if dt_atual else "sem-data"

        record_full = {
            "lead_key":                   lead_key,
            # Identificação
            "nome":                       clean_text(r.get("nome")),
            "telefone":                   clean_text(r.get("telefone")),
            "telefone_normalizado":       telefone_norm,
            "email":                      email_norm,
            "modalidade":                 clean_text(r.get("modalidade")),
            # Localização
            "cidade":                     clean_text(r.get("cidade")),
            "estado":                     clean_text(r.get("estado")),
            "curso":                      clean_text(r.get("curso")),
            "escolaridade":               clean_text(r.get("escolaridade")),
            "mobile":                     normalize_bool(r.get("mobile")),
            # Datas (BRT)
            "data_hora_atual":            dt_atual,
            "data_hora_primeiro_acesso":  dt_primeiro,
            "mes_ref":                    mes_ref,
            # Mídia
            "plataforma":                 plataforma,
            "url_pagina":                 clean_text(r.get("url_pagina")),
            "utm_campaign":               clean_text(r.get("utm_campaign")),
            "utm_source":                 utm_source,
            "utm_content":                clean_text(r.get("utm_content")),
            "utm_term":                   clean_text(r.get("utm_term")),
            "utm_medium":                 clean_text(r.get("utm_medium")),
            # Tracking IDs
            "gclid":                      clean_text(r.get("gclid")),
            "fbc":                        clean_text(r.get("fbc")),
            "fbp":                        clean_text(r.get("fbp")),
            # Meta
            "record_count":               int(r.get("record_count") or 1),
        }
        # Remove None values so the upsert never overwrites existing DB data with NULL
        record = {k: v for k, v in record_full.items() if v is not None}

        # Remove chaves com valor None para não sobrescrever dados existentes
        # na mesma sessão quando o mesmo lead reaparece com dados parciais
        if lead_key in seen_keys:
            # Mantém apenas se data_hora_atual for mais recente
            prev_dt = seen_keys[lead_key].get("data_hora_atual")
            if dt_atual and prev_dt and dt_atual <= prev_dt:
                continue   # ignora visita mais antiga
        seen_keys[lead_key] = record
        rows.append(record)

    # Recria lista a partir do dict (garante última visita por lead)
    rows = list(seen_keys.values())

    print(f"  Leads únicos válidos : {len(rows):,}")
    print(f"  Ignorados test       : {skipped_test:,}")
    print(f"  Ignorados sem chave  : {skipped_nokey:,}")
    return rows


# ─── Upsert ────────────────────────────────────────────────────────────────────

def upsert_batches(client, rows: list[dict], dry_run: bool) -> None:
    total    = len(rows)
    inserted = 0
    errors   = 0

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        if dry_run:
            print(f"  [DRY-RUN] batch {batch_num}: {len(batch)} registros (primeiro lead_key: {batch[0]['lead_key']})")
            inserted += len(batch)
            continue

        try:
            (
                client
                .schema(SCHEMA)
                .table(TABLE)
                .upsert(batch, on_conflict="lead_key", ignore_duplicates=False)
                .execute()
            )
            inserted += len(batch)
            pct = inserted / total * 100
            print(f"  Upsert {inserted:,}/{total:,} ({pct:.1f}%)", end="\r")

        except Exception as e:
            errors += 1
            print(f"\n  ERRO batch {batch_num}: {e}")
            if errors >= 5:
                print("  Muitos erros — abortando.")
                break

    print(f"\n  Concluído: {inserted:,} upserted, {errors} erros de batch.")


# ─── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Ingest leads CSV → unibf.leads_crm")
    parser.add_argument("csv",       help="Caminho do CSV exportado do Looker Studio")
    parser.add_argument("--dry-run", action="store_true",
                        help="Processa sem gravar no banco")
    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"  Arquivo : {Path(args.csv).name}")
    print(f"  Destino : {SCHEMA}.{TABLE}")
    print(f"  Modo    : {'DRY-RUN' if args.dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    print("1/3 Lendo CSV...")
    df = load_csv(args.csv)
    print(f"  {len(df):,} linhas · {len(df.columns)} colunas")
    print(f"  Colunas: {list(df.columns)}\n")

    print("2/3 Transformando...")
    rows = transform(df)
    if not rows:
        print("Nenhum lead válido. Abortando.")
        sys.exit(0)
    print()

    print("3/3 Upsertando no Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    upsert_batches(client, rows, dry_run=args.dry_run)
    print("\nFeito.")


if __name__ == "__main__":
    main()
