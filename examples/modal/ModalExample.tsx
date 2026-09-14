import {
  GlModal,
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
} from "gitlab-ui-react/modal";

export default function ModalExample() {
  return (
    <GlModal>
      <GlModalTrigger category="primary" variant="confirm">Open modal</GlModalTrigger>
      <GlModalContent>
        <GlModalHeader>
          <GlModalTitle>Confirm changes</GlModalTitle>
        </GlModalHeader>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </p>
        <GlModalFooter>
          <GlModalClose>Cancel</GlModalClose>
          <GlModalClose category="primary" variant="confirm">Confirm</GlModalClose>
        </GlModalFooter>
      </GlModalContent>
    </GlModal>
  );
}
