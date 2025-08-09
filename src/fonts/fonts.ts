import { PlayerFonts } from "../typings";

export async function getFonts(): Promise<PlayerFonts> {
  return {
    families: {
      inter: {
        name: "Inter",
        kind: "variable",
        defaultStyle: "",
        styles: [
          {
            style: "normal",
            weight: "100 900",
            url: await import("./inter-variable/InterVariable.woff2"),
          },
          {
            style: "italic",
            weight: "100 900",
            url: await import("./inter-variable/InterVariable-Italic.woff2"),
          },
        ],
      },
      nebulaSans: {
        name: "Nebula Sans",
        kind: "static",
        defaultStyle: "Book",
        styles: [
          {
            name: "Light",
            style: "normal",
            weight: "300",
            url: await import("./nebula-sans/NebulaSans-Light.woff2"),
          },
          {
            name: "Light Italic",
            style: "italic",
            weight: "300",
            url: await import("./nebula-sans/NebulaSans-LightItalic.woff2"),
          },
          {
            name: "Book",
            style: "normal",
            weight: "400",
            url: await import("./nebula-sans/NebulaSans-Book.woff2"),
          },
          {
            name: "Book Italic",
            style: "italic",
            weight: "400",
            url: await import("./nebula-sans/NebulaSans-BookItalic.woff2"),
          },
          {
            name: "Medium",
            style: "normal",
            weight: "500",
            url: await import("./nebula-sans/NebulaSans-Medium.woff2"),
          },
          {
            name: "Medium Italic",
            style: "italic",
            weight: "500",
            url: await import("./nebula-sans/NebulaSans-MediumItalic.woff2"),
          },
          {
            name: "Semibold",
            style: "normal",
            weight: "600",
            url: await import("./nebula-sans/NebulaSans-Semibold.woff2"),
          },
          {
            name: "Semibold Italic",
            style: "italic",
            weight: "600",
            url: await import("./nebula-sans/NebulaSans-SemiboldItalic.woff2"),
          },
          {
            name: "Bold",
            style: "normal",
            weight: "700",
            url: await import("./nebula-sans/NebulaSans-Bold.woff2"),
          },
          {
            name: "Bold Italic",
            style: "italic",
            weight: "700",
            url: await import("./nebula-sans/NebulaSans-BoldItalic.woff2"),
          },
          {
            name: "Black",
            style: "normal",
            weight: "800",
            url: await import("./nebula-sans/NebulaSans-Black.woff2"),
          },
          {
            name: "Black Italic",
            style: "italic",
            weight: "800",
            url: await import("./nebula-sans/NebulaSans-BlackItalic.woff2"),
          },
        ],
      },
    },
  };
}
