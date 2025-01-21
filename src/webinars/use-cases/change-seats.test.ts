// Tests unitaires


import { InMemoryWebinarRepository } from '../adapters/webinar-repository.in-memory';
import { ChangeSeats } from './change-seats';
import { testUser } from '../../users/tests/user-seeds';
import { Webinar } from '../entities/webinar.entity';
import { WebinarTooManySeatsException } from '../exceptions/webinar-too-many-seats';


describe('Feature : Change seats', () => {
  // Initialisation de nos tests, boilerplates...
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toEqual(100);
  }

  async function thenUpdatedWebinarSeatsShouldBe(seats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toEqual(200);
  }

  async function whenUserChangeSeatsWith(payload) {
    await useCase.execute(payload);
  }

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  describe('Scenario: Happy path', () =>{

    const payload = {webinarId: 'webinar-id', user: testUser.alice, seats: 200};

    it('should change the number of seats for a webinar', async () => {

      await whenUserChangeSeatsWith(payload);

      await thenUpdatedWebinarSeatsShouldBe(200);
    });
  });

  describe('Scenario: webinar does not exist', () => {

    const payload = {
      webinarId: 'non-existent-webinar-id',
      user: testUser.alice,
      seats: 200,
    };

    it('should fail', async () => {
      await expect(useCase.execute(payload)).rejects.toThrow('Webinar not found');
    });
  });

  describe('Scenario: update the webinar of someone else', () => {
    const payload = { webinarId: 'webinar-id', user: testUser.bob, seats: 200 };

    it('should fail', async () => {
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('User is not allowed to update this webinar');
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to an inferior number', () => {

    const payload = { webinarId: 'webinar-id', user: testUser.alice, seats: 50 };

    it('should fail', async () => {
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('You cannot reduce the number of seats');
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to a number > 1000', () => {

    const payload = { webinarId: 'webinar-id', user: testUser.alice, seats: 1500 };

    it('should fail', async () => {
      await expect(whenUserChangeSeatsWith(payload)).rejects.toThrow('Webinar must have at most 1000 seats');
      expectWebinarToRemainUnchanged();
    });
  });


});

