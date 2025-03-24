import React from "react";
import ChildLinks from "../components/ChildLinks";

import { boardLinks } from "../components/SideNavBar";

export default function Boards() {
  return <ChildLinks routes={boardLinks} title="Agents Dashboard" />;
}
