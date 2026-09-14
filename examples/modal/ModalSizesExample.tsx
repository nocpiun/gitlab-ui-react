import {
  GlModal,
  GlModalClose,
  GlModalContent,
  GlModalFooter,
  GlModalHeader,
  GlModalTitle,
  GlModalTrigger,
} from "gitlab-ui-react/modal";

type SizeModalProps = {
  label: string;
  size: "sm" | "lg";
};

function SizeModal({ label, size }: SizeModalProps) {
  return (
    <GlModal>
      <GlModalTrigger>{label}</GlModalTrigger>
      <GlModalContent size={size}>
        <GlModalHeader>
          <GlModalTitle>{label}</GlModalTitle>
        </GlModalHeader>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <GlModalFooter>
          <GlModalClose>Close</GlModalClose>
        </GlModalFooter>
      </GlModalContent>
    </GlModal>
  );
}

export default function ModalSizesExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <SizeModal label="Open small modal" size="sm" />
      <SizeModal label="Open large modal" size="lg" />
    </div>
  );
}
