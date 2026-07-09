import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const compressVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
      });
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    // We use standard load without SharedArrayBuffer requirement
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  }

  const inputName = `input_${Date.now()}.${file.name.split('.').pop() || 'mp4'}`;
  const outputName = `output_${Date.now()}.mp4`;

  // Write the file to ffmpeg's virtual file system
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Run the compression command
  // Scale down to max 720p width/height depending on orientation, maintain aspect ratio
  // Set CRF to 28 for good compression, preset to fast
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', "scale='min(720,iw)':min'(720,ih)':force_original_aspect_ratio=decrease",
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName
  ]);

  // Read the result
  const data = await ffmpeg.readFile(outputName);
  
  // Clean up virtual file system
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  // Return the compressed file
  return new File([(data as Uint8Array).buffer], file.name.replace(/\.[^/.]+$/, "") + ".mp4", {
    type: 'video/mp4'
  });
};
