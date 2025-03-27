sudo apt install python3 python3-pip uvicorn
curl -fsSL https://ollama.com/install.sh | sh
ollama pull codellama
sudo apt install python3-venv
python3 -m venv myenv
. myenv/bin/activate
<<<<<<< HEAD
sudo apt install -y gdown
gdown --folder https://drive.google.com/drive/folders/1hMjzdD5_DL7vmzGWuYXGDCnEvRSNMgnX?usp=sharing ./models
pip3 install fastapi uvicorn transformers torch
uvicorn main:app --host 0.0.0.0 --port 8000
=======
pip3 install fastapi uvicorn transformers torch
uvicorn main:app --host 0.0.0.0 --port 8000

>>>>>>> codellama_backend
