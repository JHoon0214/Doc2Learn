import { Controller, Get, Param, Render } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Controller()
export class ViewController {
  constructor(private storageService: StorageService) {}

  @Get()
  @Render('home')
  home() {
    const documents = this.storageService.listDocuments();
    return { title: 'Home', documents };
  }

  @Get('view/:id')
  @Render('document')
  viewDocument(@Param('id') id: string) {
    const meta = this.storageService.getDocumentMeta(id);
    const translation = this.storageService.getTranslation(id);
    return { title: meta?.title ?? 'Document', meta, translation };
  }
}
