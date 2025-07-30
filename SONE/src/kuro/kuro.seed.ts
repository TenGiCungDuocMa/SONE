import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kuro } from 'src/shared/schemas/kuro.schema';

interface OldParticipant {
  address: string;
  deposit: string;
}

@Injectable()
export class KuroSeedService {
  private readonly logger = new Logger(KuroSeedService.name);

  constructor(@InjectModel(Kuro.name) private kuroModel: Model<Kuro>) {}

  async updateSeedParticipantDatabase() {
    try {
      // Lấy tất cả các documents
      const allKuros = await this.kuroModel.find({}).lean();
      let updatedCount = 0;

      for (const kuro of allKuros) {
        if (kuro.participants && Array.isArray(kuro.participants)) {
          // Kiểm tra xem cấu trúc hiện tại có phải là cấu trúc mới không
          const isNewStructure = kuro.participants.every(
            (participant) =>
              participant.deposits && Array.isArray(participant.deposits),
          );

          if (!isNewStructure) {
            // Chuyển đổi cấu trúc participants
            const newParticipants = kuro.participants.map((participant) => {
              const oldParticipant = participant as unknown as OldParticipant;
              return {
                address: oldParticipant.address,
                deposits: [
                  {
                    amount: oldParticipant.deposit,
                    tokenAddress: '0x0000000000000000000000000000000000000000',
                  },
                ],
              };
            });

            // Cập nhật document với cấu trúc mới
            await this.kuroModel.updateOne(
              { _id: kuro._id },
              { $set: { participants: newParticipants } },
            );
            updatedCount++;
          }
        }
      }

      this.logger.log(
        `Successfully updated ${updatedCount} documents with new participants structure`,
      );
      return {
        success: true,
        message: `Successfully updated ${updatedCount} documents with new participants structure`,
      };
    } catch (error) {
      this.logger.error(
        `Error updating participants structure: ${error.message}`,
      );
      throw error;
    }
  }
}
