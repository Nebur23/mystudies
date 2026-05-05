

import type { UploadRouter } from "~/routes/api.uploadthing";



import { generateReactHelpers } from "@uploadthing/react";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();