/**
 * src/lib/petPhotos.ts
 *
 * Photo config for the Home species circles + launch popup. Reuses the same
 * warm portrait images the scan pages already show (continuity: the dog you tap
 * on Home is the dog on the dog page), zoomed to the pet's face for the circle.
 */
export interface PetPhoto {
  src: string;
  /** background-position focusing the circle on the pet's face. */
  position: string;
  /** background-size (>100% zooms into the face). */
  size: string;
  alt: string;
}

export const PET_PHOTOS: Record<'dog' | 'cat', PetPhoto> = {
  dog: {
    src: '/assets/connection_close.png',
    position: '72% 48%',
    size: '185%',
    alt: 'A calm, happy golden retriever',
  },
  cat: {
    src: '/assets/cat_connection_close.png',
    position: '70% 52%',
    size: '175%',
    alt: 'A relaxed, content ginger cat',
  },
};
