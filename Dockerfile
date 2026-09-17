FROM python:3.11-slim
WORKDIR /app
COPY GratThree.py .
CMD ["python", "GratThree.py", "10", "25", "15"]