from pydantic import BaseModel, Field
from typing import List, Optional

class Shot(BaseModel):
    shot_number: int = Field(..., description="The sequence number of the shot, starting at 1")
    shot_type: str = Field(..., description="Composition/type of the shot (e.g. establishing, closeup, wide, medium, over_the_shoulder, reaction, tracking, cinematic)")
    duration: int = Field(..., description="Expected duration in seconds")
    camera_angle: str = Field(..., description="Camera angle (e.g. wide, eye_level, low_angle, high_angle, over_the_shoulder, closeup, tracking)")
    emotion: str = Field(..., description="Emotional tone of the shot")
    description: str = Field(..., description="Visual description of the action, characters, framing and setting")
    image: Optional[str] = Field(None, description="The filename of the generated image for this shot, if any")

class StoryboardResponse(BaseModel):
    shots: List[Shot]
