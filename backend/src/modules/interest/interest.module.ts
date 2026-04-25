import { Module } from "@nestjs/common";
import { ChallengeModule } from "../challenges/challenge.module";
import { InterestController } from "./interest.controller";
import { InterestService } from "./interest.service";

@Module({
  imports: [ChallengeModule],
  controllers: [InterestController],
  providers: [InterestService],
  exports: [InterestService]
})
export class InterestModule {}
