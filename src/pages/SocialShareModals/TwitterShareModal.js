import React, { useState } from "react";
import BaseSocialShareModal from "./BaseSocialShareModal";
import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Text,
  Image,
} from "@chakra-ui/react";

const TwitterShareModal = ({ isOpen, onClose, postData }) => {
  const [formData, setFormData] = useState({
    tweet: postData?.content || "",
    image: postData?.image?.url || "",
    scheduledTime: postData?.scheduleDate || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    try {
      // Twitter API integration here
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated API call
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <BaseSocialShareModal
      isOpen={isOpen}
      onClose={onClose}
      title="Share to X (Twitter)"
      onShare={handleShare}
      platformName="X (Twitter)"
      isLoading={isLoading}
    >
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Tweet</FormLabel>
          <Textarea
            value={formData.tweet}
            onChange={(e) =>
              setFormData({ ...formData, tweet: e.target.value })
            }
            placeholder="What's happening?"
            maxLength={280}
          />
          <Text fontSize="sm" color="gray.500" align="right">
            {formData.tweet.length}/280
          </Text>
        </FormControl>
        {formData.image && (
          <Image
            src={formData.image}
            alt="Tweet image"
            maxH="200px"
            objectFit="cover"
          />
        )}
        <FormControl>
          <FormLabel>Schedule Time (UTC)</FormLabel>
          <Input
            type="datetime-local"
            value={formData.scheduledTime.replace(" ", "T")}
            onChange={(e) =>
              setFormData({
                ...formData,
                scheduledTime: e.target.value.replace("T", " "),
              })
            }
          />
        </FormControl>
      </Stack>
    </BaseSocialShareModal>
  );
};

export default TwitterShareModal;
