import { useEffect, useState } from "react";
import { Modal, Button, TransitionablePortal } from "semantic-ui-react";
import { FullScreenNode, CodeBook, SessionData } from "../../../types";
import Markdown from "../../Common/Markdown";

interface InstructionsProps {
  codebook: CodeBook;
  sessionData: SessionData;
  fullScreenNode: FullScreenNode;
}

const Instructions = ({ codebook, sessionData, fullScreenNode }: InstructionsProps) => {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState(null);

  useEffect(() => {
    const inst = codebook?.settings?.instruction;
    if (!inst) {
      setInstruction(null);
      setOpen(false);
      return;
    }
    setInstruction(inst);
    if (codebook?.settings?.auto_instruction) {
      if (!sessionData.seenInstructions[inst]) setOpen(true);
      sessionData.seenInstructions[inst] = true;
    }
  }, [codebook, sessionData]);

  if (!instruction) return null;

  return (
    <TransitionablePortal
      closeOnTriggerClick
      transition={{ duration: 200 }}
      mountNode={fullScreenNode || undefined}
      onClose={() => setOpen(false)}
      open={open}
      style={{ zIndex: 10000 }}
      trigger={
        <Button
          size="huge"
          icon="help circle"
          style={{
            background: "transparent",
            cursor: "pointer",
            color: "white",
            padding: "4px 5px 4px 5px",
            maxWidth: "40px",
            zIndex: 1000,
          }}
          onClick={() => setOpen(true)}
        />
      }
    >
      <Modal
        closeIcon
        mountNode={fullScreenNode || undefined}
        open={true}
        onClose={() => setOpen(false)}
        style={{ zIndex: 10000 }}
      >
        <Modal.Content scrolling style={{ zIndex: 10000 }}>
          <Markdown>{instruction}</Markdown>
        </Modal.Content>
      </Modal>
    </TransitionablePortal>
  );
};

export default Instructions;
