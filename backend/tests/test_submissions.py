import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submission_lifecycle(client: AsyncClient, create_test_token):
    startup_token = await create_test_token(user_id=20, role="STARTUP")

    # Creating submission for non-existent pilot returns 404
    res = await client.post(
        "/pilot-submissions",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"pilot_id": 99999, "results": "Sample results"},
    )
    assert res.status_code == 404
