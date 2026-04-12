import { Box, Typography } from "@mui/material";

export default function NotFoundPage() {
  return (
    <Box textAlign="center" py={8}>
      <Typography variant="h2" gutterBottom>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1">
        The page you're looking for doesn't exist.
      </Typography>
    </Box>
  );
}
