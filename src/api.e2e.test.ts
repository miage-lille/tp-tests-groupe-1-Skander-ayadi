import { User } from './users/entities/user.entity';
import supertest from 'supertest';
import { TestServerFixture } from './tests/fixtures';

describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should update webinar seats', async () => {
    // ARRANGE: Set up the necessary test data (webinar) in the database
    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();

    const webinar = await prisma.webinar.create({
      data: {
        id: 'test-webinar',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'test-user',
      },
    });

    // ACT: Perform the action of updating the webinar seats
    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({ seats: '30' })
      .expect(200);

    // ASSERT: Verify that the response is correct and that the webinar seats are updated
    expect(response.body).toEqual({ message: 'Seats updated' });

    const updatedWebinar = await prisma.webinar.findUnique({
      where: { id: webinar.id },
    });
    expect(updatedWebinar?.seats).toBe(30);
  });

  it('should return 404 if webinar not found', async () => {
    // ARRANGE: Prepare the test case where the webinar does not exist
    const server = fixture.getServer();

    // ACT: Try to update seats for a non-existent webinar
    const response = await supertest(server)
      .post(`/webinars/unknown-webinar/seats`)
      .send({ seats: '30' })
      .expect(404);

    // ASSERT: Ensure that the correct error message is returned
    expect(response.body).toEqual({ error: 'Webinar not found' });
  });

  it('should return 401 if the user is not the organizer', async () => {
    // ARRANGE: Set up a webinar with a specific organizer
    const prisma = fixture.getPrismaClient();
    const server = fixture.getServer();

    const webinar = await prisma.webinar.create({
      data: {
        id: 'test-webinar',
        title: 'Webinar Test',
        seats: 10,
        startDate: new Date(),
        endDate: new Date(),
        organizerId: 'test-user',
      },
    });

    // ACT: Try to update seats with a user who is not the organizer
    const response = await supertest(server)
      .post(`/webinars/${webinar.id}/seats`)
      .send({
        user: {
          id: 'test-user-not-organizer',
          email: 'email@example.com',
          password: 'password',
        },
        seats: '30',
      })
      .expect(401);

    // ASSERT: Ensure that the error message is correct, indicating the user is not the organizer
    expect(response.body).toEqual({ message: 'Webinar not organizer' });
  });
});
