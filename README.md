# node-mongo-big-file-exercise

Hola! Este es un ejercicio para poner a prueba tus conocimientos de NodeJS y MongoDB. El objetivo es realizar un endpoint que reciba un archivo de ~80mb separado por comas y guarde cada uno de los registros del archivo en la base de datos.

El archivo podés descargarlo de este link:
https://drive.google.com/file/d/1tg8dWr4RD2CeKjEdlZdTT8kLDzfITv_S/view?usp=sharing
(está zippeado para que lo descargues rápido, descomprimilo manualmente)

Se evaluará teniendo en cuenta la prolijidad del código (indentación, comentarios y legibilidad), la performance (tiempo de procesado y memoria utilizada) y escalabilidad (si soporta archivos aún más grandes).

Para simplificarlo, hemos creado este repo starter que se conecta a la base de datos, crea el modelo y expone el endpoint `[POST] /upload` donde tenés que subir el archivo (podés probarlo con Postman). En el archivo `src/controller.js` tenés que ingresar tu código.

## Consideraciones

- Hace un fork de este repo para comenzar, y cuando tengas la solución compartí tu repositorio con quien te solicitó este ejercicio.
- Recordá correr `npm install` o `yarn install` para instalar las dependencias
- Podés usar hasta 1 librería de tu preferencia además de las incluídas.
- En el endpoint `[GET] /records` podés ver los 10 últimos registros que se procesaron.
- El archivo subido se guarda en el directorio `_temp`, recordá eliminarlo luego de utilizarlo.
- Modificá el archivo `.env` para cambiar el puerto y la conexión a la base de datos.

## Postman
En el directorio `postman` del repo, vas a encontrar los dos requests para que puedas importarlos en Postman.

## Solución implementada

La solución utiliza streams (`readline`) para leer el archivo línea por línea, evitando cargarlo completo en memoria. Se salta el encabezado y se procesan registros válidos en **batches de 10.000 registros**, insertándolos con `insertMany` en paralelo.

Al finalizar, se elimina el archivo temporal con `fs.promises.unlink`.

### Flujo general

1. Se lee el archivo `.csv` línea por línea.
2. Cada línea válida se convierte en un objeto del modelo `Records`.
3. Los registros se agrupan en lotes (`BATCH_SIZE = 10.000`).
4. Se insertan los lotes en paralelo (`MAX_PARALLEL_INSERTS = 3`).
5. Se eliminan los archivos temporales una vez finalizada la carga.

---

##  Estrategias de optimización aplicadas

 **Streams (`readline`)**  Evita cargar archivos enteros en RAM = Escalabilidad y bajo uso de memoria 
 
 **`insertMany` con `{ ordered: false }`** Inserciones rápidas y sin bloqueo secuencial =  Mejora de rendimiento (~10-20%) 
 
 **Lotes de 10.000 registros**  Equilibrio entre rendimiento y memoria = Inserciones eficientes
 
 **Paralelismo controlado (`Promise.all`)**  Inserciones concurrentes sin saturar recursos = Aumenta el throughput
 
 **Eliminación de archivos temporales**  Limpieza automática post-procesamiento = Ahorro de espacio y prevención de errores 
 
 **Conteo y validación de líneas malformadas**  Robustez y trazabilidad = Registro de líneas descartadas 

---

## Comparativa de rendimiento

 Lectura completa (`readFile`) + insertMany paralelo |  2m 11s | Rápido pero poco escalable (uso alto de RAM) 
 
 Lectura con `readline` + insertMany paralelo | 2m 10s | Igual de rápido, con mucha menos memoria 
 
 `bulkWrite` con objetos insertOne | 3m 55s | Más lento en este caso, aunque robusto 

 **Nota:** El uso de `readline` y paralelismo controlado permite manejar archivos mucho más grandes (300MB+), sin comprometer la estabilidad del sistema.

---

##  Resultado final

- Se cargaron exitosamente **999.991 registros** en aproximadamente **2 minutos**.
- El código es limpio, modular, comentado y robusto ante errores de formato.
- El sistema es **escalable** y puede adaptarse fácilmente a cargas mayores ajustando los parámetros (`BATCH_SIZE`, `MAX_PARALLEL_INSERTS`).
- Se cumple con los criterios solicitados

---


##  Cómo correr el proyecto

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/AndreaCastanoS/node-mongo-big-file-exercise.git
   ```
   
 2. Instalar dependencias:
```bash
 npm install
```

3. Crear un archivo `.env` en la raíz del proyecto copiando el contenido de `.env.example`.
   Reemplazar las variables con tus valores reales, por ejemplo tu URL de MongoDB.

4. Correr el proyecto
```bash
npm run dev
```
