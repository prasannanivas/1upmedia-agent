import React from "react";
import ChildLinks from "../components/ChildLinks";

import { agentLinks } from "../components/SideNavBar";

export default function Agents() {
  return <ChildLinks routes={agentLinks} title="Agents Dashboard" />;
}
