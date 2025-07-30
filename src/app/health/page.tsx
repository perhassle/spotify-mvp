export default function HealthPage() {
  return (
    <div>
      <h1>Spotify MVP Health Check</h1>
      <p>Server is running!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}