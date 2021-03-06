import React, { useEffect } from "react";
import { Button, Ref, Icon, SemanticICONS } from "semantic-ui-react";
import { SwipeOptions, Swipes, AnswerItem, OnSelectParams, AnswerOption } from "../../../types";

const arrowKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

interface AnnotinderProps {
  /** An array of answer items (matching the items array in length and order)  */
  answerItems: AnswerItem[];
  /** The options the user can choose from */
  swipeOptions: SwipeOptions;
  /** The function used to update the values */
  onSelect: (params: OnSelectParams) => void;
  /** A string telling what direction was swiped */
  swipe: Swipes;
  /** If true, all eventlisteners are stopped */
  blockEvents: boolean;
}

const Annotinder = React.memo(
  ({ answerItems, swipeOptions, onSelect, swipe, blockEvents }: AnnotinderProps) => {
    // const left = options.find(option => option.swipe === "left");
    // const up = options.find(option => option.swipe === "up");
    // const right = options.find(option => option.swipe === "right");

    useEffect(() => {
      if (swipe) {
        if (swipe === "right") onSelect({ value: swipeOptions.right.code, finish: true });
        if (swipe === "up") onSelect({ value: swipeOptions.up.code, finish: true });
        if (swipe === "left") onSelect({ value: swipeOptions.left.code, finish: true });
      }
    }, [swipe, onSelect, swipeOptions]);

    const onKeydown = React.useCallback(
      (event) => {
        // any arrowkey
        if (arrowKeys.includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          let option;
          if (event.key === "ArrowRight") option = swipeOptions.right;
          if (event.key === "ArrowUp") option = swipeOptions.up;
          if (event.key === "ArrowLeft") option = swipeOptions.left;
          onSelect({ value: option.code, finish: true });
          const el = option.ref.current;
          el.classList.add("active");
          setTimeout(() => el.classList.remove("active"), 5);
        }
      },

      [onSelect, swipeOptions]
    );

    useEffect(() => {
      if (!blockEvents) {
        window.addEventListener("keydown", onKeydown);
      } else window.removeEventListener("keydown", onKeydown);

      return () => {
        window.removeEventListener("keydown", onKeydown);
      };
    }, [onKeydown, blockEvents]);

    const value = answerItems?.[0]?.values?.[0];

    return (
      <Button.Group
        fluid
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          fontSize: "inherit",
          margin: "0",
        }}
      >
        {["left", "up", "right"].map((direction) => {
          return (
            <AnnotinderButton
              key={direction}
              swipeOptions={swipeOptions}
              direction={direction}
              value={value}
              onSelect={onSelect}
            />
          );
        })}
      </Button.Group>
    );
  }
);

interface AnnotinderButtonProps {
  swipeOptions: SwipeOptions;
  direction: string;
  value: string | number;
  onSelect: (params: OnSelectParams) => void;
}

const AnnotinderButton = ({ swipeOptions, direction, value, onSelect }: AnnotinderButtonProps) => {
  let icon: SemanticICONS = "arrow left";
  let option: AnswerOption = swipeOptions.left;
  if (direction === "up") {
    icon = "arrow up";
    option = swipeOptions.up;
  }
  if (direction === "right") {
    icon = "arrow right";
    option = swipeOptions.right;
  }
  if (!option) return null;

  return (
    <Ref key={option.code} innerRef={option.ref}>
      <Button
        className="ripplebutton"
        disabled={option == null}
        onClick={(e, d) => onSelect({ value: option?.code, finish: true })}
        style={{
          fontSize: "inherit",
          borderRadius: "10px",
          border: `4px solid ${value === option?.code ? "#0c4f83" : "white"}`,
          background: option?.color || "white",
        }}
      >
        <div style={{ color: "black", fontWeight: "bold" }}>
          <Icon name={option?.code ? (icon as SemanticICONS) : null} />
          <br />
          <span>{option?.code || ""}</span>
        </div>
      </Button>
    </Ref>
  );
};

export default Annotinder;
