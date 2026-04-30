import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Sube un archivo a Cloudinary.
 * Detecta automáticamente si es imagen o documento (PDF).
 * Los PDFs se suben con resource_type 'raw' para que sean descargables directamente.
 */
export async function uploadFile(
  file: Buffer,
  folder: string,
  filename: string,
  mimeType?: string
): Promise<string> {
  const isPdf = mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `neife/${folder}`,
          public_id: filename, // Mantener el nombre completo con extensión
          resource_type: isPdf ? 'raw' : 'image',
          type: 'upload', // Hacer el archivo público por defecto
          use_filename: true,
          unique_filename: false,
          access_mode: 'public', // Asegurar acceso público
          // Para imágenes: compresión automática
          ...(isPdf
            ? {} // Sin flags para permitir visualización inline en el navegador
            : {
                quality: 'auto',
                fetch_format: 'auto',
                width: 1920,
                crop: 'limit',
              }),
        },
        (error, result) => {
          if (error) reject(error)
          else {
            // Cloudinary maneja el Content-Type y descarga correctamente para archivos raw
            resolve(result!.secure_url)
          }
        }
      )
      .end(file)
  })
}

export { cloudinary }
