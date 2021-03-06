import React, { useState, useEffect, useRef } from "react";
import { ImageField, RenderedImages } from "../../../types";

interface Size {
  height: string;
  width: string;
}

export default function renderImages(
  image_fields: ImageField[],
  containerRef: any
): RenderedImages {
  const images: RenderedImages = {};
  for (let image_field of image_fields) {
    images[image_field.name] = (
      <AnnotatableImage key={image_field.name} ref={containerRef} image_field={image_field} />
    );
  }
  return images;
}

interface AnnotatableImageProps {
  image_field: ImageField;
}

const AnnotatableImage = React.forwardRef(({ image_field }: AnnotatableImageProps, ref) => {
  const container = ref;
  const img = useRef();
  const [size, setSize] = useState({ height: undefined, width: undefined });
  const extraspace = image_field.caption ? 56 : 6; // reserve 50 px for caption + 6 for border

  useEffect(() => {
    const onResize = () => updateImageSize(img, container, setSize, extraspace);

    onResize();
    // Listen for changes to screen size and orientation
    window.addEventListener("resize", onResize);
    if (window?.screen?.orientation) {
      window.screen.orientation?.addEventListener("change", onResize);
    } //else if (window?.orientation) window.orientation?.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (window?.screen?.orientation) {
        window.screen.orientation.removeEventListener("change", onResize);
      } //else if (window?.orientation) window.orientation?.removeEventListener("change", onResize);
    };
  }, [extraspace, container, img]);

  //image_field.style = { maxWidth: "500px" };

  let src = image_field.base64 ? `data:image/jpeg;base64,${image_field.value}` : image_field.value;

  return (
    <figure
      style={{
        display: "block",
        flexDirection: "column",
        textAlign: "center",
        margin: "0",
      }}
    >
      <img
        ref={img}
        className="AnnotatableImage"
        onLoad={() => updateImageSize(img, container, setSize, extraspace)}
        data-imagefieldname={image_field.name}
        key={image_field.name}
        alt={image_field.alt}
        src={src}
        style={{
          border: "3px double grey", // DON"T CHANGE BORDER WIDTH WITHOUT ADJUSTING OFFSET IN getImagePosition.js
          flex: "1 1 auto",
          background: "white",
          width: size.width,
          height: size.height,
          ...image_field?.style,
        }}
      />
      <figcaption
        style={{
          marginLeft: "10px",
          marginRight: "10px",
          height: image_field.caption ? "50px" : "0px",
        }}
      >
        {image_field.caption}
      </figcaption>
    </figure>
  );
});

const updateImageSize = (
  img: any,
  container: any,
  setSize: (value: Size) => void,
  bottomSpace = 0
) => {
  // use window.innerHeight for height, because vh on mobile is weird (can include the address bar)
  // use document.documentElement.clientwidth for width, to exclude the scrollbar
  if (!img.current || !container.current) return;
  const [ih, iw] = [img.current.naturalHeight - bottomSpace, img.current.naturalWidth];
  const [ch, cw] = [container.current.clientHeight - bottomSpace, container.current.clientWidth];
  const byHeight = ih / iw > ch / cw;
  if (byHeight) {
    setSize({ height: Math.min(ch, ih) + "px", width: "auto" });
  } else {
    setSize({ width: Math.min(cw, iw) + "px", height: "auto" });
  }
};
