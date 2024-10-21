"use client";

import { useState } from "react";
import { AppHero } from "../ui/ui-layout";
import { ClusterUiModal } from "./cluster-ui";
import { ClusterUiTable } from "./cluster-ui";

export default function ClusterFeature() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <AppHero
        title="Clusters"
        subtitle="Manage and select your Solana clusters"
      >
        <ClusterUiModal />
      </AppHero>
      <ClusterUiTable />
    </div>
  );
}
