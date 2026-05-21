
import { createRouteHandler, createUploadthing } from "uploadthing/remix";
import type { FileRouter } from "uploadthing/types";

const f = createUploadthing();

const uploadRouter = {
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ event }) => {
      // You should perform authentication here
      //const authObject = await auth.api.getSession({headers: event.request.headers});
      //console.log({ authObject });

      //if (!authObject?.user?.id) {
      //   throw new UploadThingError("You need to be signed in to upload");
      // }

      return { userId: "authObject.user.id" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      //console.log("Upload complete for userId:", metadata.userId);
      //console.log("file url", file.ufsUrl);
    }),
  // ✅ new — library resource files (PDF, DOC, ZIP, PPT)
  resourceUploader: f({
    pdf: { maxFileSize: "256MB", maxFileCount: 1 },
    "application/zip": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/vnd.ms-powerpoint": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async ({ }) => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Resource uploaded:", file.ufsUrl);
    }),

} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;


const handlers = createRouteHandler({ router: uploadRouter });

export const loader = handlers.loader;
export const action = handlers.action;


