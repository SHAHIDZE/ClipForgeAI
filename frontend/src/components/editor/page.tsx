"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Editor from "../../components/editor/Editor";
import { useEditorStore } from "../../../store/editor/useEditorStore";

export default function EditorPage() {
  const searchParams = useSearchParams();

  const mediaUrl = useEditorStore(
    (state) => state.mediaUrl,
  );

  const setMedia = useEditorStore(
    (state) => state.setMedia,
  );

  useEffect(() => {
    const videoUrl = searchParams.get("video");
    const filename = searchParams.get("filename");

    if (videoUrl && !mediaUrl) {
      setMedia(
        videoUrl,
        0,
        filename,
      );
    }
  }, [
    searchParams,
    mediaUrl,
    setMedia,
  ]);

  return <Editor />;
}