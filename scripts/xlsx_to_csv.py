"""One-off conversion of the supplied spreadsheet to the CSV the dashboards read.

The exercise references northstar_flagship_30_day_metrics.csv; the file we received
was an .xlsx with identical columns. Run from the repo root:

    python scripts/xlsx_to_csv.py ../northstar_flagship_30_day_metrics.xlsx
"""
import sys
from pathlib import Path

import pandas as pd

src = Path(sys.argv[1] if len(sys.argv) > 1 else "../northstar_flagship_30_day_metrics.xlsx")
out = Path(__file__).resolve().parent.parent / "data" / "northstar_flagship_30_day_metrics.csv"

df = pd.read_excel(src)
df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
df.to_csv(out, index=False)
print(f"Wrote {len(df)} rows to {out}")
