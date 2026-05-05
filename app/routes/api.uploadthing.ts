
import { createRouteHandler, createUploadthing } from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";
import type { FileRouter } from "uploadthing/types";
import { auth } from "~/lib/auth.server";

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
} satisfies FileRouter;

//export type UploadRouter = typeof uploadRouter;

export const { loader, action } = createRouteHandler({ router: uploadRouter });