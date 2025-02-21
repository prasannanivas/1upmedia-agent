import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Button,
  useToast,
} from "@chakra-ui/react";

const BaseSocialShareModal = ({
  isOpen,
  onClose,
  title,
  children,
  onShare,
  platformName,
  isLoading,
}) => {
  const toast = useToast();

  const handleShare = async () => {
    try {
      await onShare();
      toast({
        title: "Success!",
        description: `Successfully shared to ${platformName}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || `Failed to share to ${platformName}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Share to {platformName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="medium">
              {title}
            </Text>
            {children}
            <Button
              colorScheme="blue"
              onClick={handleShare}
              isLoading={isLoading}
              loadingText={`Sharing to ${platformName}...`}
            >
              Share to {platformName}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BaseSocialShareModal;
