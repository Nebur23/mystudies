

import type { UploadRouter } from "~/routes/api.uploadthing";
 import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";


import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing, uploadFiles } =
generateReactHelpers<UploadRouter>();


export const UploadButton = generateUploadButton<UploadRouter>();
export const UploadDropzone = generateUploadDropzone<UploadRouter>();
