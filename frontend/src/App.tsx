import Container from "@mui/material/Container";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import PersonGrid from "./PersonGrid";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Person service
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          CRUD над сущностью Person через REST API <code>/api/v1/persons</code>
        </Typography>
        <Paper sx={{ mt: 2, p: 1 }}>
          <PersonGrid />
        </Paper>
      </Container>
    </>
  );
}
