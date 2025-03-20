sudo apt install python3 python3-pip uvicorn
sudo apt install python3-venv
python3 -m venv myenv
. myenv/bin/activate
pip3 install fastapi transfromers torch SentencePiece spacy
uvicorn main:app --reload
