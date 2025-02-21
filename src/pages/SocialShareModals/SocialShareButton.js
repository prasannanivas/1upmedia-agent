import React, { useState } from "react";
import PropTypes from "prop-types"; // Add this import
import {
  ButtonGroup,
  Button,
  Stack,
  Text,
  useToast,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaReddit,
} from "react-icons/fa";
import FacebookShareModal from "./FacebookShareModal";
import InstagramShareModal from "./InstagramShareModal";
import TwitterShareModal from "./TwitterShareModal";
import LinkedInShareModal from "./LinkedInShareModal";
import RedditShareModal from "./RedditShareModal";

const SocialShareButtons = ({ postData, currentUser = "prasannanivas" }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Get current UTC time in YYYY-MM-DD HH:MM:SS format
  const getCurrentUTCTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace("T", " ");
  };

  const defaultScheduleTime = "2025-02-21 14:49:49"; // Updated with your current UTC time

  // Enhanced post data with current time and user
  const enhancedPostData = {
    ...postData,
    scheduleDate: postData?.scheduleDate || defaultScheduleTime,
    author: currentUser,
    lastModified: getCurrentUTCTime(),
  };

  const closeModal = () => {
    setActiveModal(null);
    setIsLoading(false);
  };

  const handleError = (platform, error) => {
    toast({
      title: `${platform} Share Error`,
      description: error.message || `Failed to share to ${platform}`,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  // Platform-specific button configurations
  const platforms = [
    {
      id: "facebook",
      name: "Facebook",
      icon: FaFacebook,
      color: "facebook",
      modal: FacebookShareModal,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: FaInstagram,
      color: "pink",
      modal: InstagramShareModal,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: FaTwitter,
      color: "twitter",
      modal: TwitterShareModal,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: FaLinkedin,
      color: "linkedin",
      modal: LinkedInShareModal,
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: FaReddit,
      color: "orange",
      modal: RedditShareModal,
    },
  ];

  return (
    <Stack spacing={4}>
      <Text fontSize="lg" fontWeight="medium">
        Share to Social Media
      </Text>

      <ButtonGroup spacing={4} flexWrap="wrap">
        {platforms.map((platform) => (
          <Tooltip
            key={platform.id}
            label={`Share to ${platform.name}`}
            placement="top"
          >
            <IconButton
              icon={<platform.icon />}
              colorScheme={platform.color}
              onClick={() => setActiveModal(platform.id)}
              isLoading={isLoading && activeModal === platform.id}
              aria-label={`Share to ${platform.name}`}
              size="lg"
              variant="solid"
              isDisabled={!postData}
            />
          </Tooltip>
        ))}
      </ButtonGroup>

      {/* Modals */}
      <FacebookShareModal
        isOpen={activeModal === "facebook"}
        onClose={closeModal}
        postData={enhancedPostData}
      />

      <InstagramShareModal
        isOpen={activeModal === "instagram"}
        onClose={closeModal}
        postData={enhancedPostData}
      />

      <TwitterShareModal
        isOpen={activeModal === "twitter"}
        onClose={closeModal}
        postData={enhancedPostData}
      />

      <LinkedInShareModal
        isOpen={activeModal === "linkedin"}
        onClose={closeModal}
        postData={enhancedPostData}
      />

      <RedditShareModal
        isOpen={activeModal === "reddit"}
        onClose={closeModal}
        postData={enhancedPostData}
      />
    </Stack>
  );
};

// PropTypes for type checking
SocialShareButtons.propTypes = {
  postData: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    image: PropTypes.shape({
      url: PropTypes.string,
      alt: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
    }),
    scheduleDate: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  currentUser: PropTypes.string,
};

export default SocialShareButtons;
