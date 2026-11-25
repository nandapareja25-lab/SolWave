# D'ORATA · Oro Laminado 18K — Tienda online

Plataforma de ecommerce propia para **dorata18k.com**: tienda pública mobile-first + panel administrativo privado.

| Documento | Contenido |
|---|---|
| [`ESTADO.md`](ESTADO.md) | Dónde va el proyecto, decisiones y pendientes |
| [`docs/01-ARQUITECTURA.md`](docs/01-ARQUITECTURA.md) | Arquitectura, administración, seguridad, carpetas, variables, despliegue |
| [`docs/02-BASE-DE-DATOS.md`](docs/02-BASE-DE-DATOS.md) | Esquema de datos explicado + pruebas |
| [`docs/03-FLUJOS.md`](docs/03-FLUJOS.md) | Tienda, checkout, inventario, venta manual, garantías, admin, calculadora |
| [`docs/04-PROPUESTA-VISUAL.md`](docs/04-PROPUESTA-VISUAL.md) | Las 3 direcciones visuales de la home |
| [`direcciones-abc.html`](direcciones-abc.html) | Comparativa visual (abrir en el navegador) |
| [`supabase/`](supabase/) | Migraciones SQL, datos iniciales y pruebas |

## Probar el esquema localmente

Con la CLI de Supabase (Docker):
```bash
supabase start          # aplica migrations/ y seed.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/tests/inventory_and_rls_test.sql
```
Resultado esperado: 12 líneas `OK`.
