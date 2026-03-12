from fastapi import FastAPI, HTTPException
from services.prediction_service import prediction_service
from typing import List, Dict, Any
import uvicorn

app = FastAPI(title="ThreadTrack Predictive Engine")

@app.get("/")
def read_root():
    return {"message": "ThreadTrack Predictive Service is online"}

@app.get("/predict", response_model=List[Dict[str, Any]])
def get_inventory_prediction(days: int = 7):
    try:
        predictions = prediction_service.predict_stockout(window_days=days)
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
