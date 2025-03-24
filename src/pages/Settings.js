import React from "react";
import ChildLinks from "../components/ChildLinks";

import { settingsLinks } from "../components/SideNavBar";

export default function Settings() {
  return <ChildLinks routes={settingsLinks} title="Agents Dashboard" />;
}
