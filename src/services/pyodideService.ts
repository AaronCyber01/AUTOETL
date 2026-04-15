export class PyodideService {
  private pyodide: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.pyodide) return;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // @ts-ignore
        this.pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
        });
        await this.pyodide.loadPackage("pandas");
      } catch (error) {
        console.error("Failed to initialize Pyodide", error);
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();
    return this.initPromise;
  }

  async profileDataset(csvData: string): Promise<any> {
    await this.init();
    try {
      this.pyodide.globals.set("csv_data", csvData);
      const code = `
import pandas as pd
import io
import json

df = pd.read_csv(io.StringIO(csv_data))

total_rows = len(df)
total_columns = len(df.columns)
total_cells = total_rows * total_columns
overall_missing_pct = float((df.isnull().sum().sum() / total_cells) * 100) if total_cells > 0 else 0.0
duplicate_rows = int(df.duplicated().sum())

columns_info = []

for col in df.columns:
    series = df[col]
    non_null_series = series.dropna()
    
    unique_count = int(series.nunique(dropna=True))
    null_count = int(series.isnull().sum())
    null_pct = float((null_count / total_rows) * 100) if total_rows > 0 else 0.0
    
    sample_values = non_null_series.head(3).astype(str).tolist()
    
    inferred_type = "text"
    
    if len(non_null_series) > 0:
        is_numeric = pd.to_numeric(non_null_series, errors='coerce').notnull().all()
        if is_numeric:
            inferred_type = "numeric"
        else:
            bool_vals = set(non_null_series.astype(str).str.lower().unique())
            if bool_vals.issubset({'true', 'false', '1', '0', 'yes', 'no', '1.0', '0.0'}):
                inferred_type = "boolean"
            else:
                is_date = pd.to_datetime(non_null_series, errors='coerce').notnull().all()
                if is_date:
                    inferred_type = "datetime"
                elif unique_count <= max(10, 0.05 * total_rows):
                    inferred_type = "categorical"
                else:
                    inferred_type = "text"
                        
    columns_info.append({
        "name": str(col),
        "type": inferred_type,
        "uniqueCount": unique_count,
        "nullPct": null_pct,
        "sampleValues": sample_values
    })

profile = {
    "summary": {
        "totalRows": total_rows,
        "totalColumns": total_columns,
        "overallMissingPct": overall_missing_pct,
        "duplicateRows": duplicate_rows
    },
    "columns": columns_info
}

json.dumps(profile)
`;
      const result = await this.pyodide.runPythonAsync(code);
      return JSON.parse(result);
    } catch (error) {
      console.error("Error profiling dataset:", error);
      throw error;
    }
  }

  async getDataFrameStats(csvData: string): Promise<any> {
    await this.init();
    try {
      this.pyodide.globals.set("csv_data", csvData);
      const code = `
import pandas as pd
import io
import json

df = pd.read_csv(io.StringIO(csv_data))
stats = {
    "rowCount": len(df),
    "columnCount": len(df.columns),
    "nullRates": (df.isnull().sum() / len(df)).to_dict(),
    "dtypes": df.dtypes.astype(str).to_dict()
}
json.dumps(stats)
`;
      const result = await this.pyodide.runPythonAsync(code);
      return JSON.parse(result);
    } catch (error) {
      console.error("Error getting stats:", error);
      throw error;
    }
  }

  async executeCode(csvData: string, pythonCode: string): Promise<{ csv: string, stats: any }> {
    await this.init();

    try {
      this.pyodide.globals.set("csv_data", csvData);

      const wrapperCode = `
import pandas as pd
import io
import json

df = pd.read_csv(io.StringIO(csv_data))

${pythonCode}

if 'result_df' not in locals():
    raise ValueError("The code must define a 'result_df' variable containing the final DataFrame.")

stats = {
    "rowCount": len(result_df),
    "columnCount": len(result_df.columns),
    "nullRates": (result_df.isnull().sum() / len(result_df)).to_dict(),
    "dtypes": result_df.dtypes.astype(str).to_dict()
}

result_csv = result_df.to_csv(index=False)
json.dumps({"csv": result_csv, "stats": stats})
`;
      const result = await this.pyodide.runPythonAsync(wrapperCode);
      return JSON.parse(result);
    } catch (error) {
      console.error("Error executing Python code:", error);
      throw error;
    }
  }

  async executeStep(csvData: string, pythonCode: string): Promise<{ csv: string, rowCount: number, colCount: number }> {
    await this.init();
    try {
      this.pyodide.globals.set("csv_data", csvData);
      const wrapperCode = `
import pandas as pd
import io
import json

df = pd.read_csv(io.StringIO(csv_data))

${pythonCode}

current_df = df
if 'result_df' in locals():
    current_df = result_df

result_csv = current_df.to_csv(index=False)
json.dumps({
    "csv": result_csv, 
    "rowCount": len(current_df), 
    "colCount": len(current_df.columns)
})
`;
      const result = await this.pyodide.runPythonAsync(wrapperCode);
      return JSON.parse(result);
    } catch (error) {
      console.error("Error executing step:", error);
      throw error;
    }
  }
}

export const pyodideService = new PyodideService();
