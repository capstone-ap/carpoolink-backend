Param(
    [string]$PythonExe = "C:\Users\admin\Desktop\2026 캡스톤디자인\Capstone\venv\Scripts\python.exe",
    [string]$ProjectRoot = "C:\Users\admin\Desktop\2026 캡스톤디자인\Capstone",
    [string]$ModelName = "beomi/KcELECTRA-base-v2022",
    [string]$OutputDir = "carpoolink/services/model/question_detection/kc_electra_question_detector"
)

Set-Location $ProjectRoot

& $PythonExe "carpoolink/services/question-service/scripts/train_kc_electra_question_detector.py" `
  --train-path "carpoolink/data/processed/question_detection/train.csv" `
  --valid-path "carpoolink/data/processed/question_detection/valid.csv" `
  --test-path "carpoolink/data/processed/question_detection/test.csv" `
  --model-name $ModelName `
  --output-dir $OutputDir `
  --num-train-epochs 3 `
  --learning-rate 2e-5 `
  --train-batch-size 16 `
  --eval-batch-size 32 `
  --max-length 96 `
  --weight-decay 0.01 `
  --warmup-ratio 0.1 `
  --gradient-accumulation-steps 2 `
  --logging-steps 100 `
  --save-total-limit 2 `
  --gradient-checkpointing
