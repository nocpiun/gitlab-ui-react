import {
  GlModal,
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
} from "gitlab-ui-react/modal";

const paragraphs = Array.from({ length: 30 }, (_, index) => (
  `Lorem ipsum dolor sit amet, consectetur adipiscing elit ${index + 1}. `
  + "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
));

export default function ModalScrollableExample() {
  return (
    <GlModal>
      <GlModalTrigger>Open scrollable modal</GlModalTrigger>
      <GlModalContent scrollable>
        <GlModalHeader>
          <GlModalTitle>Scrollable content</GlModalTitle>
        </GlModalHeader>
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <GlModalFooter>
          <GlModalClose>Close</GlModalClose>
        </GlModalFooter>
      </GlModalContent>
    </GlModal>
  );
}
