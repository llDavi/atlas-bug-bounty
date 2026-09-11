import { ClerkProvider } from "@clerk/clerk-react";
import { useLamp } from "./lamp";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/* Clerk's own modals are dressed as pages of the book, in whichever light the
   reader has the lamp set to. These have to be literals because Clerk builds
   its own stylesheet — they mirror styles/manuscript.css. */
const DAY = {
  paper: "#e6dcc0", paperLit: "#f2ead6", ink: "#2b241c", inkSoft: "#5b5140",
  rubric: "#8a2f23", rubricDeep: "#6d251c", green: "#4a5c37",
  rule: "rgba(43,36,28,0.42)", ruleStrong: "rgba(20,16,12,0.78)",
};
const NIGHT = {
  paper: "#1d1813", paperLit: "#262019", ink: "#ddd0b0", inkSoft: "#a3947a",
  rubric: "#c65a45", rubricDeep: "#8e3325", green: "#8b9c66",
  rule: "rgba(221,208,176,0.30)", ruleStrong: "rgba(244,232,202,0.52)",
};

function appearanceFor(night) {
  const c = night ? NIGHT : DAY;
  return {
    variables: {
      colorPrimary: c.rubric,
      colorBackground: c.paper,
      colorInputBackground: c.paperLit,
      colorText: c.ink,
      colorTextSecondary: c.inkSoft,
      colorDanger: c.rubricDeep,
      colorSuccess: c.green,
      colorBorder: c.rule,
      borderRadius: "0px",
      fontFamily: '"EB Garamond", "IM Fell English", Georgia, serif',
      fontFamilyButtons: '"IM Fell English SC", "Cinzel", Georgia, serif',
    },
    elements: {
      card: { border: `1px solid ${c.ruleStrong}`, boxShadow: "none" },
      formButtonPrimary: { textTransform: "uppercase", letterSpacing: "0.16em", boxShadow: "none" },
      headerTitle: { fontFamily: '"IM Fell English", Georgia, serif', fontWeight: 400 },
    },
  };
}

export default function ClerkBound({ children }) {
  const { night } = useLamp();
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={appearanceFor(night)}>
      {children}
    </ClerkProvider>
  );
}
