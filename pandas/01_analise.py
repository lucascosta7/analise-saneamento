# %%

import pandas as pd

df = pd.read_csv("saneamento.csv", sep=",")
df

# %%


# Estados mais investiram em água e esgoto
df["investimento_agua_esgoto"] = df["investimento_agua_estado"] + df["investimento_esgoto_estado"]
df[["ano", "sigla_uf", "investimento_agua_esgoto"]].sort_values(by="investimento_agua_esgoto", ascending=False).fillna(0)

# %%


# Percentual da população urbana que tem acesso à água encanada
df["acesso_agua_%"] = (df["populacao_atendida_agua"] / df["populacao_urbana"] * 100)
df[["acesso_agua_%"]].fillna(0)
df[df['acesso_agua_%'] < 100][["sigla_uf", "acesso_agua_%"]]

# %%


# Cobertura de esgoto por estado
df["cobertura_esgoto_%"] = (df["populacao_atentida_esgoto"] / df["populacao_urbana"] * 100).mean()
df[["cobertura_esgoto_%"]].fillna(0)
df[df['cobertura_esgoto_%'] < 100][["sigla_uf", "cobertura_esgoto_%"]]

# %%


# Municípios com zero investimento ou cobertura
filtro = df["investimento_total_municipio"] == 0
df[filtro][["sigla_uf", "investimento_total_municipio"]]