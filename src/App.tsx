import { useState } from "react";
import CancellationForm from "./CancellationForm";
import ChangeForm from "./ChangeForm";
import CounselingSheet from "./CounselingSheet";
import type { DocMode } from "./ModeTabs";
import SpecialLeaveForm from "./SpecialLeaveForm";
import TermsForm from "./TermsForm";

function App() {
  const [mode, setMode] = useState<DocMode>("counseling");

  if (mode === "terms") {
    return <TermsForm mode={mode} onModeChange={setMode} />;
  }
  if (mode === "cancellation") {
    return <CancellationForm mode={mode} onModeChange={setMode} />;
  }
  if (mode === "change") {
    return <ChangeForm mode={mode} onModeChange={setMode} />;
  }
  if (mode === "specialLeave") {
    return <SpecialLeaveForm mode={mode} onModeChange={setMode} />;
  }
  return <CounselingSheet mode={mode} onModeChange={setMode} />;
}

export default App;
