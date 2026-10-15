/**
 * Category and occasion types
 */
export interface Category {
  id?: string;
  name: string;
  slug?: string;
  imageType: string;
  bgColor?: string;
  nameAr?: string;
  image_type?: string;
  bg_color?: string;
  name_ar?: string;
}

export interface Occasion {
  id?: string;
  name: string;
  slug?: string;
  imageType: string;
  nameAr?: string;
  image_type?: string;
  name_ar?: string;
}
