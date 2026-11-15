import { PROFILE_PHOTO_LIMIT } from "../profile";

export async function prepareProfilePhoto(file: File) {
  if (
    (file.type && !file.type.startsWith("image/")) ||
    file.size > 12_000_000
  ) {
    throw new Error("Choose an image under 12 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(side, 256);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context || !side) throw new Error("Image unavailable.");
    context.fillStyle = "#21172e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      (image.naturalWidth - side) / 2,
      (image.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const photo = canvas.toDataURL("image/jpeg", 0.82);
    if (photo.length > PROFILE_PHOTO_LIMIT) throw new Error("Image too large.");
    return photo;
  } catch {
    throw new Error("Couldn’t open this photo. Try a different image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
