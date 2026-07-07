# Integration Test Checklist

1. Start all containers: `cd open_live_local && docker compose up -d`
2. Verify /studio (existing) still works
3. Verify /studio-modular loads, all modules render
4. Verify WS messages flow (meters animate, tally updates)
5. Verify pop-outs work for each module
6. Verify keyboard shortcuts in controller module
7. Verify output flow API endpoints respond
8. Verify adding clips to mediaplayer doesn't auto-start
