## Javascript

Para instalar o node (servidor para as requisições)

```bash
sudo apt update
sudo apt install nodejs npm
```

Na pasta do back

```bash
npm install
```

---
## Python

Primeiramente criar o Ambiente virtual:

```bash
python -m venv venv
```

Para ativar no windows:

```bash
./venv/Scripts/activate
```

Para ativar no mac ou linux:

```bash
source ./venv/bin/activate
```


Depois instalar as dependências:

```bash
pip install -r .\requirements.txt
```

## Servindo o front end
Para disponibiliza o frontend (para conseguir usar o modo humano), utilize o seguinte comando:
```bash
python3 -m http.server 8080 --bind 0.0.0.0
```