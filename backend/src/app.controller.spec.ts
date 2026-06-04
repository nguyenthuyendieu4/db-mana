import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(() => {
    appController = new AppController();
  });

  describe('health', () => {
    it('should return service health metadata', () => {
      const response = appController.health();
      expect(response.service).toBe('dbstack-manager-backend');
      expect(response.status).toBe('ok');
      expect(response.timestamp).toBeDefined();
    });
  });
});
