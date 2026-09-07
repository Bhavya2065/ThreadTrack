import psycopg2
import pandas as pd
from datetime import datetime, timedelta
from config import settings, database_url


class PredictionService:
    def __init__(self):
        self.dsn = database_url()

    def get_connection(self):
        if not self.dsn:
            raise RuntimeError(
                "NEON_DATABASE_URL / DATABASE_URL is not configured for the prediction service"
            )
        return psycopg2.connect(self.dsn, sslmode="require")

    def predict_stockout(self, window_days=7):
        conn = self.get_connection()
        try:
            # 1. Fetch current stock levels
            materials_query = (
                'SELECT materialid AS "MaterialID", name AS "Name", '
                'currentstock AS "CurrentStock", unit AS "Unit" FROM rawmaterials'
            )
            df_materials = pd.read_sql(materials_query, conn)

            # 2. Fetch production logs for the requested window to calculate rate
            start_date = datetime.now() - timedelta(days=window_days)
            logs_query = """
                SELECT pl.quantityproduced AS "QuantityProduced",
                       p.basematerialid AS "BaseMaterialID",
                       p.materialquantityperunit AS "MaterialQuantityPerUnit",
                       pl.logdate AS "LogDate"
                FROM productionlogs pl
                JOIN products p ON pl.productid = p.productid
                WHERE pl.logdate >= %s
            """
            df_logs = pd.read_sql(logs_query, conn, params=(start_date,))

            if df_logs.empty:
                return [{"material": m["Name"], "days_remaining": "N/A (No production data)"} for _, m in df_materials.iterrows()]

            # 3. Calculate material consumption per log
            df_logs['consumed'] = df_logs['QuantityProduced'] * df_logs['MaterialQuantityPerUnit']

            # 4. Calculate average daily consumption per material
            # Group by material and date (to handle multiple logs per day)
            df_logs['date'] = pd.to_datetime(df_logs['LogDate']).dt.date
            daily_usage = df_logs.groupby(['BaseMaterialID', 'date'])['consumed'].sum().reset_index()
            avg_daily_usage = daily_usage.groupby('BaseMaterialID')['consumed'].mean().reset_index()

            # 5. Merge with materials to calculate days remaining
            results = df_materials.merge(avg_daily_usage, left_on='MaterialID', right_on='BaseMaterialID', how='left')

            # Fix: Handle division by zero if consumption is 0 or NaN
            results['days_remaining'] = results.apply(
                lambda row: row['CurrentStock'] / row['consumed'] if not pd.isna(row['consumed']) and row['consumed'] > 0 else 999,
                axis=1
            )

            prediction_list = []
            for _, row in results.iterrows():
                prediction_list.append({
                    "material": row['Name'],
                    "current_stock": row['CurrentStock'],
                    "unit": row['Unit'],
                    "avg_daily_usage": round(row['consumed'], 2) if not pd.isna(row['consumed']) else 0,
                    "days_remaining": round(row['days_remaining'], 1) if row['days_remaining'] != 999 else "No usage detected",
                    "status": "Warning" if row['days_remaining'] < 3 else "Healthy"
                })

            return prediction_list

        finally:
            conn.close()

prediction_service = PredictionService()
