from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / 'data' / 'mock-data.json'

app = FastAPI(
    title='API de Saneamento',
    description='API para servir os dados do dashboard de saneamento.',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def load_data() -> dict[str, Any]:
    if not DATA_PATH.exists():
        raise HTTPException(status_code=500, detail='Arquivo de dados não encontrado.')

    with DATA_PATH.open('r', encoding='utf-8-sig') as fp:
        return json.load(fp)


@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.get('/api/dashboard')
def dashboard() -> dict[str, Any]:
    return load_data()


@app.get('/api/estados/{uf}')
def estado_detalhado(uf: str) -> dict[str, Any]:
    data = load_data()
    uf = uf.upper()

    estado = next((e for e in data['estados'] if e['sigla_uf'] == uf), None)
    if not estado:
        raise HTTPException(status_code=404, detail='Estado não encontrado.')

    municipios = [m for m in data['municipios'] if m['sigla_uf'] == uf]
    return {'estado': estado, 'municipios': municipios}


@app.get('/api/municipios-criticos')
def municipios_criticos(
    q: str = Query(default='', description='Filtro por município ou sigla UF.'),
) -> dict[str, Any]:
    data = load_data()
    query = q.strip().lower()

    rows = data['municipios_criticos']
    if query:
        rows = [
            row for row in rows
            if query in row['municipio'].lower() or query in row['sigla_uf'].lower()
        ]

    return {'total': len(rows), 'itens': rows}
